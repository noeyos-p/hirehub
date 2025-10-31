package com.we.hirehub.convert;

import com.we.hirehub.entity.CareerLevel;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;

/**
 * 엔티티 구조를 바꾸지 않고 CareerLevel <-> VARCHAR 매핑.
 * CareerLevel 이 enum 이 아니라 "값 객체"여도 동작하도록 리플렉션 기반으로 처리한다.
 *
 * 저장 시 우선순위: getCode() -> getValue() -> toString()
 * 복원 시 우선순위: static of(String)/from(String)/fromCode(String)/valueOf(String)
 *                -> (String) 생성자
 *                -> 기본생성자 + setCode(String)/setValue(String)
 */
@Converter(autoApply = true)
public class CareerLevelConverter implements AttributeConverter<CareerLevel, String> {

    @Override
    public String convertToDatabaseColumn(CareerLevel attribute) {
        if (attribute == null) return null;

        // 1) getCode()
        try {
            Method m = attribute.getClass().getMethod("getCode");
            Object v = m.invoke(attribute);
            if (v != null) return v.toString();
        } catch (Exception ignore) { }

        // 2) getValue()
        try {
            Method m = attribute.getClass().getMethod("getValue");
            Object v = m.invoke(attribute);
            if (v != null) return v.toString();
        } catch (Exception ignore) { }

        // 3) 최후: toString()
        return attribute.toString();
    }

    @Override
    public CareerLevel convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;

        Class<CareerLevel> clazz = CareerLevel.class;

        // 1) 정적 팩토리: of/from/fromCode/valueOf(String)
        for (String method : new String[]{"of", "from", "fromCode", "valueOf"}) {
            try {
                Method m = clazz.getMethod(method, String.class);
                Object v = m.invoke(null, dbData);
                return clazz.cast(v);
            } catch (NoSuchMethodException e) {
                // 다음 후보 메서드 시도
            } catch (Exception e) {
                throw new IllegalArgumentException("CareerLevel." + method + "(String) 호출 실패: " + e.getMessage(), e);
            }
        }

        // 2) (String) 생성자
        try {
            Constructor<CareerLevel> c = clazz.getConstructor(String.class);
            return c.newInstance(dbData);
        } catch (NoSuchMethodException e) {
            // 다음 경로 시도
        } catch (Exception e) {
            throw new IllegalArgumentException("CareerLevel(String) 생성자 호출 실패: " + e.getMessage(), e);
        }

        // 3) 기본생성자 + setCode/setValue
        try {
            CareerLevel obj = clazz.getDeclaredConstructor().newInstance();
            boolean set = false;
            for (String setter : new String[]{"setCode", "setValue"}) {
                try {
                    Method m = clazz.getMethod(setter, String.class);
                    m.invoke(obj, dbData);
                    set = true;
                    break;
                } catch (NoSuchMethodException ignored) {
                }
            }
            if (set) return obj;
        } catch (Exception e) {
            throw new IllegalArgumentException("CareerLevel 기본 생성/세터 복원 실패: " + e.getMessage(), e);
        }

        // 4) 모든 경로 실패
        throw new IllegalArgumentException("문자열 '" + dbData + "' 를 CareerLevel 로 변환할 수 없습니다.");
    }
}
