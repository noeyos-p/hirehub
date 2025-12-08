package com.we.hirehub.util;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class VectorUtil {
    public double cosine(List<Double> a, List<Double> b) {
        int n = Math.min(a.size(), b.size());
        double dot = 0, na = 0, nb = 0;
        for (int i = 0; i < n; i++) {
            double x = a.get(i), y = b.get(i);
            dot += x * y;
            na += x * x;
            nb += y * y;
        }
        if (na == 0 || nb == 0) return 0;
        return dot / (Math.sqrt(na) * Math.sqrt(nb));
    }
}
